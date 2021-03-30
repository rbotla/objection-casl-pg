const { Model } = require('objection');
const Knex = require('knex');

// Initialize knex.
const knex = Knex({
  client: 'pg',
  useNullAsDefault: true,
  connection: 'postgresql://postgres:changeme@localhost/postgres'
});

// Give the knex instance to objection.
Model.knex(knex);

// Person model.
class Newhire extends Model {
  static get tableName() {
    return 'newhires';
  }

  static get relationMappings() {
    return {
      children: {
        relation: Model.HasManyRelation,
        modelClass: ITRequest,
        join: {
          from: 'newhires.id',
          to: 'it_requests.newhire_id'
        }
      }
    };
  }
}

class ITRequest extends Model {
  static get tableName() {
    return 'it_requests';
  }
}

async function createSchema() {
  if (!await knex.schema.hasTable('newhires')) {
    await knex.schema.createTable('newhires', table => {
      table.increments('id').primary();
      //table.integer('parentId').references('persons.id');
      table.string('first_name');
      table.string('last_name');
      table.timestamp('start_date');
    });
  }


  if (!await knex.schema.hasTable('it_requests')) {
    await knex.schema.createTable('it_requests', table => {
      table.integer('newhire_id').references('newhires.id');
      //table.integer('parentId').references('persons.id');
      table.increments('id').primary();
      table.string('category');
      table.string('status');
      table.timestamp('creation_date');
    });
  }
}

async function main() {
  // Create some people.
  const sylvester = await Newhire.query().insertGraph({
    first_name: 'Sylvester',
    last_name: 'Stalon',
    start_date: new Date().toISOString(),
    children: [
      { id: '1', category: 'Desktop Services', status: 'Opened', creation_date: new Date().toISOString() },
      { id: '2', category: 'Desktop Hardware Request', status: 'In Progress', creation_date: new Date().toISOString() },
      { id: '3', category: 'Software request', status: 'Opened', creation_date: new Date().toISOString() }
    ]
  });

  console.log('created:', sylvester);

  // Fetch all people named Sylvester and sort them by id.
  // Load `children` relation eagerly.
  const tickets = await Newhire.query()
    .where('first_name', 'Sylvester')
    .withGraphFetched('children')
    .orderBy('id');

  console.log('sylvester tickets:', tickets);
}

createSchema()
  .then(() => main())
  .then(() => knex.destroy())
  .catch(err => {
    console.error(err);
    return knex.destroy();
  });
