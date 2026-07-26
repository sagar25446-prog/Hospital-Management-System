/**
 * Request validation for hospital endpoints. Plain JS, no extra deps.
 */

function validateHospitalSearch(query) {
  const { search, city, specialty, limit, offset } = query || {};
  
  let parsedLimit = 50;
  if (limit !== undefined) {
    parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return { error: { message: 'Invalid limit parameter' } };
    }
    if (parsedLimit > 100) parsedLimit = 100;
  }

  let parsedOffset = 0;
  if (offset !== undefined) {
    parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return { error: { message: 'Invalid offset parameter' } };
    }
  }

  return {
    value: {
      search: typeof search === 'string' ? search.trim() : '',
      city: typeof city === 'string' ? city.trim() : '',
      specialty: typeof specialty === 'string' ? specialty.trim() : '',
      limit: parsedLimit,
      offset: parsedOffset
    }
  };
}

module.exports = {
  validateHospitalSearch
};
