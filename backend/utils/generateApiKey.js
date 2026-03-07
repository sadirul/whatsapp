import { v4 as uuidv4 } from 'uuid';

export const generateApiKey = () => {
  return `wpaw_${uuidv4().replace(/-/g, '')}`;
};
