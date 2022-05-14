const path = require('path');

/**
	@type import('npm-binary').NpmBinaryConfig
 */
module.exports = {
	binaries: {
		'git-cliff': {
			async getBinary({ download, platform, tar, tmpDir, extractZip }) {
				const dir = await tmpDir();
				const gitCliffArchivePath = path.join(dir, 'git-cliff.zip');
				switch (platform) {
					case 'win32': {
						await download(
							'https://github.com/orhun/git-cliff/releases/download/v0.7.0/git-cliff-0.7.0-i686-pc-windows-msvc.zip',
							gitCliffArchivePath
						);
						await extractZip(gitCliffArchivePath, { dir });
						break;
					}
					case 'darwin': {
						await download(
							'https://github.com/orhun/git-cliff/releases/download/v0.7.0/git-cliff-0.7.0-x86_64-apple-darwin.tar.gz',
							gitCliffArchivePath
						);
						await tar.extract({ file: gitCliffArchivePath, cwd: dir });
						break;
					}
					case 'linux': {
						await download(
							'https://github.com/orhun/git-cliff/releases/download/v0.7.0/git-cliff-0.7.0-x86_64-unknown-linux-gnu.tar.gz',
							gitCliffArchivePath
						);
						await tar.extract({ file: gitCliffArchivePath, cwd: dir });
					}
				}

				if (platform === 'win32') {
					return path.join(dir, 'git-cliff-0.7.0/git-cliff.exe');
				} else {
					return path.join(dir, 'git-cliff-0.7.0/git-cliff');
				}
			},
		},
	},
};
