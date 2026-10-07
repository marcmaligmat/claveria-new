import * as migration_20261007_042458_initial from './20261007_042458_initial';
import * as migration_20261007_103933_username_login from './20261007_103933_username_login';

export const migrations = [
  {
    up: migration_20261007_042458_initial.up,
    down: migration_20261007_042458_initial.down,
    name: '20261007_042458_initial',
  },
  {
    up: migration_20261007_103933_username_login.up,
    down: migration_20261007_103933_username_login.down,
    name: '20261007_103933_username_login'
  },
];
