export const authBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email', maxLength: 254 },
    password: { type: 'string', minLength: 6, maxLength: 128 },
  },
};

export interface AuthBody {
  email: string;
  password: string;
}
