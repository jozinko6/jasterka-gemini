# Database Plan - Jašterka Hlohovec

## Entities

### User
- id, email, password, name, role (ADMIN, MANAGER, KITCHEN, DELIVERY, CUSTOMER)
- relations: orders, courierProfile, reservations

### Category
- id, name, slug, order
- relations: items

### MenuItem
- id, categoryId, name, description, price, allergens, image, isPizza, isActive
- relations: category, orderItems, options

### MenuItemOption
- id, menuItemId, name, price
- relations: menuItem

### Order
- id, userId, status (NEW, ACCEPTED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, COMPLETED, REJECTED), type (PICKUP, DELIVERY)
- total, deliveryFee, deliveryAddress, deliveryZoneId, courierId, createdAt, updatedAt
- relations: user, items, statusHistory, deliveryZone, courier

### OrderItem
- id, orderId, menuItemId, quantity, price, note

### OrderStatusHistory
- id, orderId, status, createdAt, note

### DeliveryZone
- id, name, fee, minOrder, color
- relations: orders

### Courier
- id, userId, vehicleType (BICYCLE, CAR, SCOOTER), isOnline
- relations: user, orders, shifts

### CourierShift
- id, courierId, startTime, endTime, isPeak

### Reservation
- id, userId, name, email, phone, date, guests, note, status (PENDING, CONFIRMED, CANCELLED)

### DailyMenu
- id, date, content (Markdown/JSON)

### RestaurantSetting
- id, key, value
