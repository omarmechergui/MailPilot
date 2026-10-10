export const validateRequest = (schema) => {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.format(),
      });
    }

    if (parsed.data.body) {
      req.body = parsed.data.body;
    }
    if (parsed.data.query) {
      // In Express 5, req.query is a getter. Re-assigning it directly fails.
      // Instead, clear it and assign new properties, or avoid Zod coercing query objects.
      // Zod doesn't need to overwrite req.query if it's not coercing or transforming.
      // For now, since we only validate body, we can just not reassign query if it's unchanged.
      // Better: clear and assign.
      for (const key in req.query) delete req.query[key];
      Object.assign(req.query, parsed.data.query);
    }
    if (parsed.data.params) {
      Object.assign(req.params, parsed.data.params);
    }
    
    next();
  };
};
