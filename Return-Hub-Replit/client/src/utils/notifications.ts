import type { Return } from "@shared/schema";

export const checkAndSendNotifications = (returns: Return[]) => {
  const permission = localStorage.getItem("notifications-enabled");
  if (permission !== "granted" || !("Notification" in window)) {
    return;
  }

  const lastSent = localStorage.getItem("notification-last-sent");
  const today = new Date().toDateString();

  if (lastSent === today) {
    return;
  }

  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour !== 9) {
    return;
  }

  const urgentReturns = returns
    .filter((r) => {
      if (r.status === "shipped" || r.status === "refunded") return false;

      const deadline = new Date(r.returnDeadline!);
      deadline.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const daysLeft = Math.ceil((deadline.getTime() - todayDate.getTime()) / 86400000);
      return daysLeft >= 0 && daysLeft <= 3;
    })
    .map((r) => {
      const deadline = new Date(r.returnDeadline!);
      deadline.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((deadline.getTime() - todayDate.getTime()) / 86400000);

      return {
        id: r.id,
        storeName: r.storeName,
        itemName: r.itemName,
        purchasePrice: parseFloat(r.purchasePrice),
        daysLeft,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (urgentReturns.length === 0) {
    return;
  }

  const totalValue = urgentReturns.reduce((sum, r) => sum + r.purchasePrice, 0);
  const storeList = urgentReturns
    .slice(0, 3)
    .map((r) => r.storeName)
    .join(", ");

  const title =
    urgentReturns.length === 1
      ? "Don't lose your money!"
      : `${urgentReturns.length} returns need attention!`;

  const body =
    urgentReturns.length === 1
      ? `Your ${urgentReturns[0].storeName} return expires in ${urgentReturns[0].daysLeft} day${urgentReturns[0].daysLeft === 1 ? "" : "s"}. ($${urgentReturns[0].purchasePrice.toFixed(2)})`
      : `${storeList}${urgentReturns.length > 3 ? "..." : ""} - $${totalValue.toFixed(2)} at risk`;

  const notification = new Notification(title, {
    body,
    icon: "/favicon.ico",
    tag: "urgent-returns",
    requireInteraction: false,
    silent: false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  localStorage.setItem("notification-last-sent", today);
};

export const startNotificationWatcher = (returns: Return[]) => {
  checkAndSendNotifications(returns);

  const intervalId = setInterval(() => {
    checkAndSendNotifications(returns);
  }, 60 * 60 * 1000);

  return intervalId;
};
