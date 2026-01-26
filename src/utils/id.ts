import 'react-native-get-random-values';
import { v7 as uuidv7 } from 'uuid';

export function generateId(): string {
  return uuidv7();
}
