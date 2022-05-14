const path = require('path');

module.exports = {
	binaries: {
		'git-cliff': {
			getBinaryPath() {
				return path.join(__dirname, './bin/git-cliff');
			},
		},
	},
};
