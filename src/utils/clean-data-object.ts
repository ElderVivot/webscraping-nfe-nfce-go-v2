export function cleanDataObject (object: Object, fieldsClean = [], fieldsNotClean = []): Object {
    let objectNew: Object = {}

    if (fieldsClean.length > 0) {
        for (const field in object) {
            if (fieldsClean.indexOf(field) >= 0) {
                objectNew[field] = undefined
            } else {
                objectNew[field] = object[field]
            }
        }
    } else if (fieldsNotClean.length > 0) {
        for (const field in object) {
            if (fieldsNotClean.indexOf(field) >= 0) {
                objectNew[field] = object[field]
            } else {
                objectNew[field] = undefined
            }
        }
    } else {
        objectNew = object
    }
    return objectNew
}

// console.log(cleanDataObject({ nome: 'test' }, [], ['nome']))