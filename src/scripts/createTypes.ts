import * as fs from 'fs';
import * as path from 'path';
import { generateNamespace } from '@gql2ts/from-schema';

import generateSchema from '../utils/generateSchema';

const typescriptTypes = generateNamespace('GQL', generateSchema());

fs.writeFile(path.join(__dirname, '../types/schema.d.ts'), typescriptTypes, err => {
  console.log(err);
});
