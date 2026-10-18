import { type NavConfig } from "@/lib/nav-config"

/** The route this page is installed at. AppShell matches the nav against it. */
export const ROUTE = "/import"

/**
 * This product's navigation, as plain data. AppShell resolves the icon names
 * and works out which item is current from the pathname, so nothing here is a
 * component and nothing here says "I am the page you are on".
 */
export const NAV: NavConfig = {
  brand: { name: "Northwind", initial: "N", href: "/saas", caption: "Production" },
  groups: [
    {
      label: "Workspace",
      items: [{ title: "Overview", href: "/saas", icon: "layout-dashboard" }],
    },
    {
      label: "Data",
      items: [
        { title: "Customers", href: "/ecommerce/customers", icon: "users" },
        { title: "Orders", href: "/ecommerce/orders", icon: "shopping-cart" },
        { title: "Invoices", href: "/finance/invoices", icon: "receipt" },
        { title: "Audit log", href: "/settings/audit-log", icon: "list" },
        { title: "Import", href: "/import", icon: "file-text" },
      ],
    },
  ],
  // Pinned under the groups, the way the secondary links were.
  footer: [
    { title: "Settings", href: "/settings", icon: "settings" },
    { title: "Support", href: "/support", icon: "life-buoy" },
  ],
}
