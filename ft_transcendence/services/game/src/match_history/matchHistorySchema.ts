
export const getMatchHistoryByIdSchema = {
  params: {
    properties: {
      id: { type: 'string', pattern: '^[0-9]+$' }
    },
    required: ['id']
  }
}