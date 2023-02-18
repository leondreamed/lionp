export declare function getLionpCli(): import("meow").Result<{
    anyBranch: {
        type: "boolean";
    };
    branch: {
        type: "string";
    };
    cleanup: {
        type: "boolean";
    };
    tests: {
        type: "boolean";
    };
    publish: {
        type: "boolean";
    };
    releaseDraft: {
        type: "boolean";
    };
    releaseDraftOnly: {
        type: "boolean";
    };
    tag: {
        type: "string";
    };
    preview: {
        type: "boolean";
    };
    testScript: {
        type: "string";
    };
    '2fa': {
        type: "boolean";
    };
    message: {
        type: "string";
    };
}>;
export declare function lionpCli(): Promise<void>;
