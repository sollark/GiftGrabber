/**
 * Pass-through validation middleware for functional contexts
 * Accepts a validator function and returns a middleware
 * @template S - State type
 * @template A - Action type
 * @param validator - Function to validate actions/state
 */
export const validationMiddleware = <S, A>(
  validator: (action: A, state: S) => any
) => {
  return (action: A, state: S): any => validator(action, state);
};
