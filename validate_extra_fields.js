
function validateExtraFields(data, model) {
    const schemaFieldNames = Object.keys(model.schema.paths);
    const requestFieldNames = Object.keys(data);

    const extraFields = requestFieldNames.filter(fieldName => !schemaFieldNames.includes(fieldName));

    if (extraFields.length > 0) {
        console.warn(`Warning: Extra fields found in the request: ${extraFields.join(', ')}`);
    }
}

module.exports = validateExtraFields;