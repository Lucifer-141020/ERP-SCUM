const isProduction = process.env.NODE_ENV === 'production';

function requiredSecret(name, developmentValue) {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) throw new Error(`生产环境必须配置 ${name} 环境变量`);
  return developmentValue;
}

module.exports = {
  jwtSecret: requiredSecret('JWT_SECRET', 'local-development-jwt-secret'),
  adminPassword: requiredSecret('ADMIN_PASSWORD', 'local-development-admin-password'),
};
