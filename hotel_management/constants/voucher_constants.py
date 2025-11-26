class VoucherConstants:
    DISCOUNT_FIXED = "FIXED"
    DISCOUNT_PERCENT = "PERCENT"

    DISCOUNT_TYPE_CHOICES = (
        (DISCOUNT_FIXED, "Fixed amount"),
        (DISCOUNT_PERCENT, "Percentage"),
    )

    STATUS_DRAFT = "DRAFT"
    STATUS_ACTIVE = "ACTIVE"
    STATUS_PAUSED = "PAUSED"
    STATUS_EXPIRED = "EXPIRED"
    STATUS_EXHAUSTED = "EXHAUSTED"

    STATUS_CHOICES = (
        (STATUS_DRAFT, "Draft"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_PAUSED, "Paused"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_EXHAUSTED, "Exhausted"),
    )

    CLAIM_ACTIVE = "ACTIVE"
    CLAIM_EXPIRED = "EXPIRED"
    CLAIM_EXHAUSTED = "EXHAUSTED"

    CLAIM_STATUS_CHOICES = (
        (CLAIM_ACTIVE, "Active"),
        (CLAIM_EXPIRED, "Expired"),
        (CLAIM_EXHAUSTED, "Exhausted"),
    )

    USAGE_APPLIED = "APPLIED"
    USAGE_ROLLED_BACK = "ROLLED_BACK"

    USAGE_STATUS_CHOICES = (
        (USAGE_APPLIED, "Applied"),
        (USAGE_ROLLED_BACK, "Rolled back"),
    )

    ACTIVE_STATUSES = {STATUS_ACTIVE}

