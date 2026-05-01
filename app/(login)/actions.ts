'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  teams,
  teamMembers,
  activityLogs,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  ActivityType,
  invitations
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  createCheckoutSession,
  createStripeConnectAccount,
  stripe
} from '@/lib/payments/stripe';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';
import { sendTeamInvitationEmail } from '@/lib/email/resend';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || ''
  };
  await db.insert(activityLogs).values(newActivity);
}

function buildInitialTeamName(email: string, subscriptionId?: string) {
  const suffix = subscriptionId ? ` (${subscriptionId.slice(-8)})` : '';
  const label = "'s Team";
  const maxEmailLength = 100 - label.length - suffix.length;

  return `${email.slice(0, Math.max(1, maxEmailLength))}${label}${suffix}`;
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const userWithTeam = await db
    .select({
      user: users,
      team: teams
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithTeam.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];
  // DEPURACIÓN: Mostrar usuario encontrado y su rol
  console.log('Usuario encontrado en login:', foundUser);

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  await Promise.all([
    setSession(foundUser),
    logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN)
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const subscriptionPriceId = formData.get('priceId') as string;
    const setupPriceId = formData.get('setupPriceId') as string | undefined;
    return createCheckoutSession({ team: foundTeam, subscriptionPriceId, setupPriceId });
  }

  // Si el usuario es superadmin, retornar redirectTo
  if (foundUser.role === 'superadmin') {
    return { redirectTo: '/dashboard/superadmin' };
  }

  if (foundUser.role === 'owner') {
    redirect('/dashboard');
  }

  if (foundUser.role === 'manager') {
    redirect('/dashboard/orders');
  }

  // Verify if user has an active subscription
  if (foundTeam) {
    const hasActiveSubscription =
      foundTeam.subscriptionStatus === 'active' ||
      foundTeam.subscriptionStatus === 'trialing';

    if (!hasActiveSubscription) {
      redirect('/pricing');
    }
  } else {
    // No team found, redirect to pricing
    redirect('/pricing');
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
  service: z.string().optional(),
  sessionId: z.string().optional()
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId, service, sessionId } = data;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizedEmail}`)
    .limit(1);
  const existingAccount = existingUser[0] || null;

  if (existingAccount) {
    const existingMembership = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.userId, existingAccount.id))
      .limit(1);

    if (existingMembership.length > 0) {
      return {
        error: 'Failed to create user. Please try again.',
        email,
        password
      };
    }
  }

  let paidCheckout:
    | {
        customerId: string;
        subscriptionId: string;
        productId: string;
        planName: string;
        subscriptionStatus: string;
      }
    | null = null;
  let pendingInvitation: typeof invitations.$inferSelect | null = null;

  if (!inviteId) {
    if (service !== 'paid' || !sessionId) {
      return {
        error: 'Please complete payment before creating an account.',
        email,
        password
      };
    }

    let checkoutData:
      | {
          customerEmail: string | null;
          customerId: string;
          subscriptionId: string;
          productId: string;
          planName: string;
          subscriptionStatus: string;
        }
      | null = null;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer']
      });

      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;

      if (session.status !== 'complete' || !subscriptionId) {
        return {
          error: 'Payment could not be verified. Please try again.',
          email,
          password
        };
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product']
      });

      const customerEmail =
        session.customer_details?.email ||
        (typeof session.customer !== 'string' &&
        session.customer &&
        !('deleted' in session.customer)
          ? session.customer.email
          : null);
      const customerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ||
            (typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id);
      const plan = subscription.items.data[0]?.price;
      const product = plan?.product;
      const productId = typeof product === 'string' ? product : product?.id;
      const planName =
        typeof product === 'string' || !product || 'deleted' in product
          ? plan?.nickname || 'Subscription'
          : product.name;

      if (!customerId || !productId) {
        return {
          error: 'Payment details are incomplete. Please contact support.',
          email,
          password
        };
      }

      checkoutData = {
        customerEmail,
        customerId,
        subscriptionId,
        productId,
        planName,
        subscriptionStatus: subscription.status
      };
    } catch (error) {
      console.error('Failed to verify checkout session during sign up:', error);
      return {
        error: 'Payment could not be verified. Please try again.',
        email,
        password
      };
    }

    if (
      !checkoutData.customerEmail ||
      checkoutData.customerEmail.toLowerCase() !== normalizedEmail
    ) {
      return {
        error: 'Use the same email address used during checkout.',
        email,
        password
      };
    }

    const existingSubscription = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.stripeSubscriptionId, checkoutData.subscriptionId))
      .limit(1);

    if (existingSubscription.length > 0) {
      return {
        error: 'This payment has already been used to create an account.',
        email,
        password
      };
    }

    paidCheckout = {
      customerId: checkoutData.customerId,
      subscriptionId: checkoutData.subscriptionId,
      productId: checkoutData.productId,
      planName: checkoutData.planName,
      subscriptionStatus: checkoutData.subscriptionStatus
    };
  } else {
    const inviteIdNumber = Number(inviteId);

    if (!Number.isInteger(inviteIdNumber)) {
      return { error: 'Invalid or expired invitation.', email, password };
    }

    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, inviteIdNumber))
      .limit(1);

    if (!invitation) {
      return { error: 'Invalid or expired invitation.', email, password };
    }

    if (invitation.status !== 'pending') {
      return { error: 'This invitation has already been used or expired.', email, password };
    }

    if (invitation.email.trim().toLowerCase() !== normalizedEmail) {
      return {
        error: 'Use the same email address that received the invitation.',
        email,
        password
      };
    }

    pendingInvitation = invitation;
  }

  const passwordHash = await hashPassword(password);

  let createdUser: User | undefined;

  const accountRole = pendingInvitation?.role || 'owner';

  if (existingAccount) {
    [createdUser] = await db
      .update(users)
      .set({
        passwordHash,
        role: accountRole,
        updatedAt: new Date()
      })
      .where(eq(users.id, existingAccount.id))
      .returning();
  } else {
    const newUser: NewUser = {
      email: normalizedEmail,
      passwordHash,
      role: accountRole
    };

    [createdUser] = await db.insert(users).values(newUser).returning();
  }

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password
    };
  }

  let teamId: number;
  let userRole: string;
  let createdTeam: typeof teams.$inferSelect | null = null;

  if (inviteId) {
    if (pendingInvitation) {
      teamId = pendingInvitation.teamId;
      userRole = pendingInvitation.role;

      await db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, pendingInvitation.id));

      await logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION);

      [createdTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);
    } else {
      return { error: 'Invalid or expired invitation.', email, password };
    }
  } else {
    // Create a new team if there's no invitation
    const newTeam: NewTeam = {
      name: buildInitialTeamName(normalizedEmail, paidCheckout?.subscriptionId),
      stripeCustomerId: paidCheckout?.customerId,
      stripeSubscriptionId: paidCheckout?.subscriptionId,
      stripeProductId: paidCheckout?.productId,
      planName: paidCheckout?.planName,
      subscriptionStatus: paidCheckout?.subscriptionStatus
    };

    [createdTeam] = await db.insert(teams).values(newTeam).returning();

    if (!createdTeam) {
      return {
        error: 'Failed to create team. Please try again.',
        email,
        password
      };
    }

    teamId = createdTeam.id;
    userRole = 'owner';

    try {
      const connectAccountId = await createStripeConnectAccount(
        createdTeam.name,
        createdTeam.id
      );
      [createdTeam] = await db
        .update(teams)
        .set({
          stripeConnectAccountId: connectAccountId,
          updatedAt: new Date()
        })
        .where(eq(teams.id, createdTeam.id))
        .returning();
    } catch (connectError) {
      console.error(
        'Failed to create Stripe Connect account during sign up:',
        connectError
      );
    }

    await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM);
  }

  const newTeamMember: NewTeamMember = {
    userId: createdUser.id,
    teamId: teamId,
    role: userRole
  };

  await Promise.all([
    db.insert(teamMembers).values(newTeamMember),
    logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
    setSession(createdUser)
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const subscriptionPriceId = formData.get('priceId') as string;
    const setupPriceId = formData.get('setupPriceId') as string | undefined;
    return createCheckoutSession({ team: createdTeam, subscriptionPriceId, setupPriceId });
  }

  // New users without subscription should go to pricing
  if (createdTeam) {
    const hasActiveSubscription =
      createdTeam.subscriptionStatus === 'active' ||
      createdTeam.subscriptionStatus === 'trialing';

    if (!hasActiveSubscription) {
      redirect('/pricing');
    }
  }

  redirect('/dashboard');
});

export async function signOut() {
  const user = (await getUser()) as User;
  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.'
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.'
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.'
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD)
    ]);

    return {
      success: 'Password updated successfully.'
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Account deletion failed.'
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')` // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

    if (userWithTeam?.teamId) {
      await db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, user.id),
            eq(teamMembers.teamId, userWithTeam.teamId)
          )
        );
    }

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional()
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { firstName, lastName, email, phone } = data;
    const name = `${firstName} ${lastName}`.trim();
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db
        .update(users)
        .set({
          name,
          firstName,
          lastName,
          email,
          phone: phone || null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT)
    ]);

    return { firstName, lastName, success: 'Owner updated successfully.' };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.coerce.number()
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    if (user.role !== 'owner') {
      return { error: 'Only team owners can remove members' };
    }

    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.id, memberId),
          eq(teamMembers.teamId, userWithTeam.teamId)
        )
      );

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER
    );

    return { success: 'Team member removed successfully' };
  }
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['manager'])
});

function getBaseUrl() {
  return process.env.BASE_URL || 'http://localhost:3000';
}

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const normalizedEmail = email.trim().toLowerCase();
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    if (user.role !== 'owner') {
      return { error: 'Only team owners can invite managers' };
    }

    const [team] = await db
      .select({ name: teams.name })
      .from(teams)
      .where(eq(teams.id, userWithTeam.teamId))
      .limit(1);

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(
        and(
          sql`lower(${users.email}) = ${normalizedEmail}`,
          eq(teamMembers.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'User is already a member of this team' };
    }

    // Check if there's an existing invitation
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          sql`lower(${invitations.email}) = ${normalizedEmail}`,
          eq(invitations.teamId, userWithTeam.teamId),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      const inviteUrl = `${getBaseUrl()}/sign-up?inviteId=${existingInvitation[0].id}`;

      try {
        await sendTeamInvitationEmail({
          to: normalizedEmail,
          teamName: team?.name || 'MenuHub',
          inviterName: user.name || user.email,
          role,
          inviteUrl
        });
      } catch (emailError) {
        console.error('Failed to resend team invitation email:', emailError);
        return {
          error: 'Invitation is pending, but the email could not be sent. Share this link manually.',
          inviteUrl
        };
      }

      return {
        success: 'Invitation email sent successfully',
        inviteUrl
      };
    }

    // Create a new invitation
    const [invitation] = await db.insert(invitations).values({
      teamId: userWithTeam.teamId,
      email: normalizedEmail,
      role,
      invitedBy: user.id,
      status: 'pending'
    }).returning();

    const inviteUrl = `${getBaseUrl()}/sign-up?inviteId=${invitation.id}`;

    try {
      await sendTeamInvitationEmail({
        to: normalizedEmail,
        teamName: team?.name || 'MenuHub',
        inviterName: user.name || user.email,
        role,
        inviteUrl
      });
    } catch (emailError) {
      console.error('Failed to send team invitation email:', emailError);
      return {
        error: 'Invitation was created, but the email could not be sent. Share this link manually.',
        inviteUrl
      };
    }

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.INVITE_TEAM_MEMBER
    );

    return {
      success: 'Invitation email sent successfully',
      inviteUrl
    };
  }
);
