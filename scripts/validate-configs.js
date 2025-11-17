const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });

// Config files to validate
const validations = [
  {
    configPath: path.join(__dirname, '../config/module-playbooks.json'),
    schemaPath: path.join(__dirname, '../schemas/module-playbooks.schema.json'),
    name: 'Module Playbooks'
  },
  {
    configPath: path.join(__dirname, '../config/funnel-map.json'),
    schemaPath: path.join(__dirname, '../schemas/funnel-map.schema.json'),
    name: 'Funnel Map'
  }
];

let hasErrors = false;

console.log('Validating configuration files...\n');

validations.forEach(({ configPath, schemaPath, name }) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    
    const validate = ajv.compile(schema);
    const valid = validate(config);
    
    if (valid) {
      console.log(`✓ ${name}: Valid`);
    } else {
      console.error(`✗ ${name}: Invalid`);
      console.error(JSON.stringify(validate.errors, null, 2));
      hasErrors = true;
    }
  } catch (error) {
    console.error(`✗ ${name}: Error reading or parsing file`);
    console.error(error.message);
    hasErrors = true;
  }
});

console.log('\n' + (hasErrors ? 'Validation failed!' : 'All configurations valid!'));
process.exit(hasErrors ? 1 : 0);
