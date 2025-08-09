export const parseEventData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};
