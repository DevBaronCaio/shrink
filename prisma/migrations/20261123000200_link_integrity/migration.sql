ALTER TABLE "Link" ADD CONSTRAINT "Link_clickCount_nonnegative" CHECK ("clickCount" >= 0);
ALTER TABLE "Link" ADD CONSTRAINT "Link_clickLimit_positive" CHECK ("clickLimit" > 0);
ALTER TABLE "Link" ADD CONSTRAINT "Link_slug_format" CHECK ("slug" ~ '^[a-z0-9][a-z0-9_-]{1,46}[a-z0-9]$');
ALTER TABLE "RateLimitBucket" ADD CONSTRAINT "RateLimitBucket_positive_window" CHECK ("hits" > 0 AND "expiresAt" > "windowAt");
