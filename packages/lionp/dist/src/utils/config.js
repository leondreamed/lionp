import { cosmiconfig } from 'cosmiconfig';
import githubUrlFromGit from 'github-url-from-git';
import isScoped from 'is-scoped';
import { packageDirectory } from 'pkg-dir';
export async function getConfig() {
    const searchDir = await packageDirectory();
    const searchPlaces = [
        '.np-config.json',
        '.np-config.js',
        '.np-config.cjs',
        'package.json',
    ];
    const explorer = cosmiconfig('lionp', {
        searchPlaces,
        stopDir: searchDir,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { config } = (await explorer.search(searchDir)) ?? {};
    return config;
}
const defConfig = (c) => c;
export function getDefaultConfig(pkg) {
    const extraBaseUrls = ['gitlab.com'];
    const repoUrl = pkg.repository === undefined
        ? undefined
        : githubUrlFromGit(pkg.repository.url, {
            extraBaseUrls,
        });
    return defConfig({
        build: true,
        cleanup: true,
        publish: true,
        tests: true,
        releaseDraft: true,
        releaseDraftOnly: false,
        preview: false,
        anyBranch: false,
        testScript: 'test',
        buildScript: 'build',
        publishScoped: isScoped(pkg.name),
        '2fa': false,
        repoUrl,
    });
}
