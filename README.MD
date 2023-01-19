# Local cache action

Action that attempts to behave similarly to the official `actions/cache` action, except that it hosts files on 
local Inova server, making it much faster to execute on Inova's hosted builds.

# Use

```yaml
- uses: inovait/action-localcache@main
  with:
    folder: /root/.android
    key: ${{ runner.os }}-androidSDK
```

where:
* `folder` is the folder being cached
* `key` is unique key for this cache entry.

If cache entry with provided key exists, it will be downloaded and saved into a folder before build continues. 
After build finishes, cached folder will be uploaded back onto the cache server.

Cache entries are scoped to the repositories (every Github repository has its own cache, even if the keys overlap).

# Building

`npm run all`

Since GitHub action should also store built action, you should run this command and commit built files 
in addition to just source changes.
