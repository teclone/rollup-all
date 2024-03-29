module.exports = {
  repositoryUrl: 'https://github.com/teclone/rollup-all.git',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/github'],
    '@semantic-release/npm',
  ],
  ci: true,
};
