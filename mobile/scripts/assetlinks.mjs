// Run with the Play App Signing certificate (not just the upload certificate).
const hashes = process.argv.slice(2);
if (!hashes.length || hashes.some(value => !/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/i.test(value))) {
  throw new Error('Provide one or more SHA-256 signing certificate fingerprints.');
}
console.log(JSON.stringify([{ relation: ['delegate_permission/common.handle_all_urls'], target: {
  namespace: 'android_app', package_name: 'sk.chvostikovo.app', sha256_cert_fingerprints: hashes.map(value => value.toUpperCase())
} }], null, 2));
