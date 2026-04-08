#!/bin/bash

# Fix Button
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-slot"/g' src/components/ui/button.tsx

# Fix Select
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-select"/g' src/components/ui/select.tsx

# Fix Dropdown Menu
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-dropdown-menu"/g' src/components/ui/dropdown-menu.tsx

# Fix Separator
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-separator"/g' src/components/ui/separator.tsx

# Fix Label
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-label"/g' src/components/ui/label.tsx

# Fix Popover
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-popover"/g' src/components/ui/popover.tsx

# Fix Tabs
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-tabs"/g' src/components/ui/tabs.tsx

# Fix Dialog
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-dialog"/g' src/components/ui/dialog.tsx

# Fix Avatar
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-avatar"/g' src/components/ui/avatar.tsx

# Fix Tooltip
sed -i '' 's/from "radix-ui"/from "@radix-ui\/react-tooltip"/g' src/components/ui/tooltip.tsx

# Fix Sheet (uses Dialog primitive usually in older shadcn, or its own? checking...)
# Assuming sheet uses dialog or its own. Installing sheet package? 
# Shadcn sheet uses @radix-ui/react-dialog usually.
# Let's check sheet.tsx content first! I won't run sed on sheet yet.

# Fix Sidebar (uses Tooltip, Sheet, Dialog???)
# I'll check sidebar.tsx content first.
