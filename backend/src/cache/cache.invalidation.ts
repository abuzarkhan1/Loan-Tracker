import { cacheKeys } from "./cache.keys";
import { cacheService } from "./cache.service";

export const cacheInvalidation = {
  async contactChanged(userId: string, contactId?: string) {
    await Promise.all([
      cacheService.delByPattern(cacheKeys.contacts.listPattern(userId)),
      contactId ? cacheService.del(cacheKeys.contacts.detail(userId, contactId)) : Promise.resolve(0),
      cacheService.delByPattern(cacheKeys.dashboard.pattern(userId)),
    ]);
  },

  async loanChanged(userId: string, options: { loanId?: string; contactId?: string } = {}) {
    await Promise.all([
      cacheService.delByPattern(cacheKeys.loans.listPattern(userId)),
      options.loanId ? cacheService.del(cacheKeys.loans.detail(userId, options.loanId)) : cacheService.delByPattern(cacheKeys.loans.detailPattern(userId)),
      options.contactId ? cacheService.del(cacheKeys.contacts.detail(userId, options.contactId)) : cacheService.delByPattern(cacheKeys.contacts.detailPattern(userId)),
      cacheService.delByPattern(cacheKeys.dashboard.pattern(userId)),
      cacheService.delByPattern(cacheKeys.reports.pattern(userId)),
    ]);
  },

  async paymentChanged(userId: string, options: { loanId?: string; contactId?: string } = {}) {
    await this.loanChanged(userId, options);
  },
};
