function validatePostRequest(data, model) {
    const requiredFields = Object.entries(model.schema.paths)
        .filter(([fieldName, field]) => field.isRequired && !data[fieldName])
        .map(([fieldName]) => fieldName);

    if (requiredFields.length > 0) {
        const errorMessage = `Missing required fields: ${requiredFields.join(', ')}`;
        return errorMessage;
    }

    return null; // No missing required fields
}

module.exports = validatePostRequest;
