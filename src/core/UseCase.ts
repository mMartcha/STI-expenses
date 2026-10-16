/**
 * Contrato único de toda ação do aplicativo.
 * Cada caso de uso é uma classe que implementa esta interface e expõe `execute()`.
 *
 * @example
 *   const expense = await removeExpenseItemUseCase.execute({ expenseId, itemId });
 */
export interface UseCase<Input = void, Output = void> {
  execute(input: Input): Promise<Output>;
}
