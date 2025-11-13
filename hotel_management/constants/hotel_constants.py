class HotelConstants:
    HOTEL_STATUS = (
        ("Live","Live"),
        ("Draft","Draft"),
        ("Reject","Reject"),
        ("Disable","Disable"),
        ("In Preview","In Preview")
    )
    
    ROOM_STATUS = (
        ('Available','Available'),
        ('Booked','Booked'),
        ('Maintenance','Maintenance')
    )
    
    ROOM_TYPE_STATUS = (
        ('Active','Active'),
        ('Inactive','Inactive')
    )
    
    HOUSEKEEPING_STATUS = (
        ('Cleaned','Cleaned'),
        ('Dirty','Dirty'),
        ('In Progress','In Progress')
    )
    
    RULE_PRICE = (
        ("Weekend","Weekend"),
        ("Holiday","Holiday"),
        ("Occupancy","Occupancy")
    )
    
    AvailabilityStatus=(
        ("Open", "Open"),
        ("Close","Close"),
        ("Restricted", "Restricted")
    )
    
    BOOKING_STATUS= (
        ('Pending', 'Pending'),
        ('Confirm', 'Confirm'),
        ('Cancelled', 'Cancelled')
    )
    
    PAYMENT_STATUS = (
        ("Pending", "Pending"),
        ("Paid", "Paid"),
        ("Refund", "Refund"),
        ("Fail", "Fail"),
        ("Partially Refunded","Partially Refunded")
    )
    
    HOLD_RECORD = (
        ("Hold","Hold"),
        ("Confirmed",'Confirmed'),
        ('Released','Released'),
        ('Expired','Expired')
    )
    
    PAYMENT_METHOD =(
        ('PayPal', 'PayPal'),
        ('vnpay','VNPAY')
    )
    
    
    BOOKING_ROOM_STATUS = (
        ("Hold","Hold"),
        ("Booked",'Booked'),
    )
    
    REFUND_STATUS = (
        ("Completed", "Completed"),
        ("Pending","Pending"),
        ("Fail","Fail")
    )