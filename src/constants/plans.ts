export type PlanType = 'sanzala' | 'vip' | 'premium';

export interface PlanLimits {
    batidas: number; // Daily chat interactions
    stories: number; // Daily story posts
    comments: number; // Daily anonymous comments
    archive: number; // Max archived profiles
    filters: boolean; // Can use advanced filters?
    preMatch: boolean; // Can send pre-match messages?
    revealAnon: boolean; // Can reveal anonymous commenters?
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    sanzala: {
        batidas: 10,
        stories: 1,
        comments: 3,
        archive: 5,
        filters: false, // Only Age allowed
        preMatch: false,
        revealAnon: true // Explicitly allowed per requirements
    },
    vip: {
        batidas: 20,
        stories: 3,
        comments: 7,
        archive: 10,
        filters: true,
        preMatch: false,
        revealAnon: true
    },
    premium: {
        batidas: 30,
        stories: 999999,
        comments: 999999,
        archive: 999999,
        filters: true,
        preMatch: true,
        revealAnon: true
    }
};

export const PLANS = {
    SANZALA: 'sanzala' as PlanType,
    VIP: 'vip' as PlanType,
    PREMIUM: 'premium' as PlanType
};
