import UserNotifications

/// Thông báo cục bộ: thời kinh sáng/chiều, ngày rằm/mùng một. Lịch do JS tính (có âm lịch) rồi gửi sang.
enum Notifier {
    static func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral: return true
        case .denied: return false
        default:
            return (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        }
    }

    static func schedule(_ items: [[String: Any]]) async {
        let center = UNUserNotificationCenter.current()
        center.removeAllPendingNotificationRequests()
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else { return }
        for item in items.prefix(60) {
            guard let id = item["id"] as? String,
                  let ts = (item["ts"] as? NSNumber)?.doubleValue,
                  let title = item["title"] as? String else { continue }
            let content = UNMutableNotificationContent()
            content.title = title
            content.body = item["body"] as? String ?? ""
            content.sound = .default
            let date = Date(timeIntervalSince1970: ts)
            guard date > Date() else { continue }
            let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
            let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
            try? await center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
        }
    }
}
