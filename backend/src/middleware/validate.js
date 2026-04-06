const { z } = require("zod");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }
    req.body = result.data;
    next();
  };
}

const schemas = {
  register: z.object({
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  createRoom: z.object({
    categoryId: z.number().int().positive(),
    isPublic: z.boolean().optional().default(true),
    maxPlayers: z.number().int().min(2).max(20).optional().default(10),
    timerSeconds: z.number().int().min(10).max(30).optional().default(20),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().default("MEDIUM"),
    questionCount: z.number().int().min(5).max(20).optional().default(10),
  }),
};

module.exports = { validate, schemas };
