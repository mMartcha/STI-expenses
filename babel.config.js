module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Permite importar as migrations .sql geradas pelo drizzle-kit.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
