import { cacheKeys } from "./cache.keys";
import { cacheService } from "./cache.service";

export const cacheInvalidation = {
  async contactChanged(userId: string, contactId?: string) {
    await Promise.all([
      cacheService.delByPattern(cacheKeys.contacts.listPattern(userId)),
      cacheService.delByPattern(cacheKeys.contacts.favoritesPattern(userId)),
      cacheService.delByPattern(cacheKeys.contacts.recentPattern(userId)),
      contactId ? cacheService.del(cacheKeys.contacts.detail(userId, contactId)) : Promise.resolve(0),
      contactId ? cacheService.del(cacheKeys.contacts.trust(userId, contactId)) : cacheService.delByPattern(cacheKeys.contacts.trustPattern(userId)),
      cacheService.delByPattern(cacheKeys.dashboard.pattern(userId)),
      cacheService.delByPattern(cacheKeys.finance.pattern(userId)),
      cacheService.delByPattern(cacheKeys.salary.pattern(userId)),
      cacheService.delByPattern(cacheKeys.activity.pattern(userId)),
      cacheService.delByPattern(cacheKeys.recovery.pattern(userId)),
      cacheService.delByPattern(cacheKeys.communications.pattern(userId)),
    ]);
  },

  async loanChanged(userId: string, options: { loanId?: string; contactId?: string } = {}) {
    await Promise.all([
      cacheService.delByPattern(cacheKeys.loans.listPattern(userId)),
      cacheService.delByPattern(cacheKeys.loans.pinnedPattern(userId)),
      options.loanId ? cacheService.del(cacheKeys.loans.detail(userId, options.loanId)) : cacheService.delByPattern(cacheKeys.loans.detailPattern(userId)),
      options.contactId ? cacheService.del(cacheKeys.contacts.detail(userId, options.contactId)) : cacheService.delByPattern(cacheKeys.contacts.detailPattern(userId)),
      options.contactId ? cacheService.del(cacheKeys.contacts.trust(userId, options.contactId)) : cacheService.delByPattern(cacheKeys.contacts.trustPattern(userId)),
      cacheService.delByPattern(cacheKeys.dashboard.pattern(userId)),
      cacheService.delByPattern(cacheKeys.reports.pattern(userId)),
      cacheService.delByPattern(cacheKeys.finance.pattern(userId)),
      cacheService.delByPattern(cacheKeys.salary.pattern(userId)),
      cacheService.delByPattern(cacheKeys.activity.pattern(userId)),
      cacheService.delByPattern(cacheKeys.recovery.pattern(userId)),
      cacheService.delByPattern(cacheKeys.communications.pattern(userId)),
    ]);
  },

  async paymentChanged(userId: string, options: { loanId?: string; contactId?: string } = {}) {
    await this.loanChanged(userId, options);
  },

  async financeChanged(userId: string) {
    await Promise.all([
      cacheService.delByPattern(cacheKeys.transactions.pattern(userId)),
      cacheService.delByPattern(cacheKeys.categories.pattern(userId)),
      cacheService.delByPattern(cacheKeys.finance.pattern(userId)),
      cacheService.delByPattern(cacheKeys.salary.pattern(userId)),
      cacheService.delByPattern(cacheKeys.budgets.pattern(userId)),
      cacheService.delByPattern(cacheKeys.savingsGoals.pattern(userId)),
      cacheService.delByPattern(cacheKeys.dashboard.pattern(userId)),
      cacheService.delByPattern(cacheKeys.reports.pattern(userId)),
      cacheService.delByPattern(cacheKeys.activity.pattern(userId)),
    ]);
  },

  async receiptChanged(userId: string) {
    await Promise.all([
      cacheService.delByPattern(cacheKeys.receipts.pattern(userId)),
      cacheService.delByPattern(cacheKeys.activity.pattern(userId)),
      cacheService.delByPattern(cacheKeys.communications.pattern(userId)),
    ]);
  },

  async communicationChanged(userId: string) {
    await Promise.all([
      cacheService.delByPattern(cacheKeys.recovery.pattern(userId)),
      cacheService.delByPattern(cacheKeys.followUps.pattern(userId)),
      cacheService.delByPattern(cacheKeys.promises.pattern(userId)),
      cacheService.delByPattern(cacheKeys.paymentRequests.pattern(userId)),
      cacheService.delByPattern(cacheKeys.settlements.pattern(userId)),
      cacheService.delByPattern(cacheKeys.email.pattern(userId)),
      cacheService.delByPattern(cacheKeys.communications.pattern(userId)),
      cacheService.delByPattern(cacheKeys.activity.pattern(userId)),
    ]);
  },

  async backupChanged(userId: string) {
    await Promise.all([
      cacheService.delByPattern(cacheKeys.backups.pattern(userId)),
      cacheService.delByPattern(cacheKeys.userPrefix(userId) + ":*"),
    ]);
  },

  async userChanged(userId: string) {
    await cacheService.delByPattern(cacheKeys.userPrefix(userId) + ":*");
  },
};
