const validateId = require('../validateId');

describe('validateId middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('with valid ID', () => {
    it('should call next() with valid numeric ID', () => {
      req.params.id = '123';
      const middleware = validateId('id', 'test resource');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedId).toBe(123);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle different parameter names', () => {
      req.params.projectId = '456';
      const middleware = validateId('projectId', 'project');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedId).toBe(456);
    });

    it('should handle zero as valid ID', () => {
      req.params.id = '0';
      const middleware = validateId('id', 'resource');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedId).toBe(0);
    });
  });

  describe('with invalid ID', () => {
    it('should return 400 error for non-numeric ID', () => {
      req.params.id = 'abc';
      const middleware = validateId('id', 'test resource');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid test resource ID'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 for decimal numbers', () => {
      req.params.id = '12.5';
      const middleware = validateId('id', 'resource');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid resource ID'
      });
    });

    it('should return 400 for empty string', () => {
      req.params.id = '';
      const middleware = validateId('id', 'resource');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid resource ID'
      });
    });

    it('should return 400 for undefined parameter', () => {
      const middleware = validateId('nonExistent', 'resource');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid resource ID'
      });
    });

    it('should use correct resource name in error message', () => {
      req.params.employeeId = 'invalid';
      const middleware = validateId('employeeId', 'employee');

      middleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid employee ID'
      });
    });
  });
});
