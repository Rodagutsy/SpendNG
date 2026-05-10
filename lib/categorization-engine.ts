export class CategorizationEngine {
  static async categorize(transaction: any) {
    return { categoryId: 'cat-14', isFlagged: false };
  }
  static async detectSelfTransfer(transaction: any) {
    return false;
  }
}
