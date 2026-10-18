import { REFERENCE_DATE } from "@/lib/sample-data"
import { AppShell } from "@/components/ui/app-shell"
import { PageHeader } from "@/components/ui/page-header"

import { signOut } from "./actions"
import { ImportWizard } from "./components/import-wizard"
import { currentUser, lastUpdated, shellNotifications } from "./data"
import { NAV, ROUTE } from "./nav"

/**
 * The importer. A server component around one island: the file is read, mapped
 * and previewed entirely in the browser, and only the last step — writing the
 * rows — crosses back to the server, as an action.
 */
export default function ImportPage() {
  return (
    <AppShell
      nav={NAV}
      activeHref={ROUTE}
      user={currentUser()}
      notifications={shellNotifications()}
      now={REFERENCE_DATE}
      onSignOut={signOut}
    >
      <PageHeader
        title="Import"
        description="Bring a customer list in from a spreadsheet, a column at a time."
        meta={lastUpdated()}
      />

      <ImportWizard />
    </AppShell>
  )
}
