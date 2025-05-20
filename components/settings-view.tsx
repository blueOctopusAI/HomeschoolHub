"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, CreditCard } from "lucide-react"
import { SeedDatabaseButton } from "./seed-database-button"

export function SettingsView() {
  const [activeTab, setActiveTab] = useState("account")

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    name: "Sarah Johnson",
    email: "sarah@example.com",
    timezone: "America/New_York",
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    lessonReminders: true,
    studentProgress: false,
  })

  // Handle account settings change
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAccountSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle notification toggle
  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))
  }

  // Handle save account settings
  const handleSaveAccount = () => {
    // In a real app, this would save to a database or API
    alert("Account settings saved!")
  }

  // Handle save notification preferences
  const handleSaveNotifications = () => {
    // In a real app, this would save to a database or API
    alert("Notification preferences saved!")
  }

  // Handle subscription management
  const handleManageSubscription = () => {
    // In a real app, this would redirect to a subscription management page
    alert("Redirecting to subscription management...")
  }

  // Handle subscription cancellation
  const handleCancelSubscription = () => {
    // In a real app, this would show a confirmation dialog and then cancel
    if (confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features.")) {
      alert("Subscription cancelled!")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="border-[#5e8b7e]/20 bg-[#faf9f5]">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-[#5e8b7e]">Settings</CardTitle>
        </CardHeader>

        <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#e9f1e7] w-full justify-start h-10 p-1 mb-6">
            <TabsTrigger
              value="account"
              className="data-[state=active]:bg-[#5e8b7e] data-[state=active]:text-white px-4"
            >
              Account
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              className="data-[state=active]:bg-[#5e8b7e] data-[state=active]:text-white px-4"
            >
              Subscription
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-[#5e8b7e] data-[state=active]:text-white px-4"
            >
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="px-6">
              <h2 className="text-lg font-medium text-[#5e8b7e]">Account Settings</h2>
              <p className="text-[#5e8b7e]/70 text-sm">Manage your account information and preferences.</p>
            </div>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[#5e8b7e]">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={accountSettings.name}
                    onChange={handleAccountChange}
                    className="border-[#5e8b7e]/20 bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-[#5e8b7e]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={accountSettings.email}
                    onChange={handleAccountChange}
                    className="border-[#5e8b7e]/20 bg-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="timezone" className="text-[#5e8b7e]">
                    Timezone
                  </Label>
                  <Select
                    value={accountSettings.timezone}
                    onValueChange={(value) => setAccountSettings((prev) => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger id="timezone" className="border-[#5e8b7e]/20 bg-white">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveAccount} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>

              <div className="pt-6 mt-6 border-t border-[#5e8b7e]/10">
                <h3 className="text-lg font-medium text-[#5e8b7e] mb-4">Database Management</h3>
                <div className="space-y-2">
                  <p className="text-sm text-[#5e8b7e]/70 mb-4">
                    Use this button to seed the database with sample data for testing purposes. This will add sample
                    students, lessons, courses, and assignments.
                  </p>
                  <SeedDatabaseButton />
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <div className="px-6">
              <h2 className="text-lg font-medium text-[#5e8b7e]">Subscription</h2>
              <p className="text-[#5e8b7e]/70 text-sm">Manage your subscription and billing information.</p>
            </div>

            <CardContent className="space-y-6">
              <div className="bg-white border border-[#5e8b7e]/20 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-[#5e8b7e]">Premium Plan</h3>
                    <p className="text-[#5e8b7e]/70">$9.99/month</p>
                  </div>
                  <Badge className="bg-[#5e8b7e]">Active</Badge>
                </div>

                <p className="text-[#5e8b7e]/70 mb-6">Next billing date: June 15, 2025</p>

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    className="border-[#5e8b7e] text-[#5e8b7e] hover:bg-[#e9f1e7] hover:text-[#5e8b7e]"
                  >
                    Cancel Subscription
                  </Button>
                  <Button onClick={handleManageSubscription} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Subscription
                  </Button>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="px-6">
              <h2 className="text-lg font-medium text-[#5e8b7e]">Notification Settings</h2>
              <p className="text-[#5e8b7e]/70 text-sm">Configure how and when you receive notifications.</p>
            </div>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-[#5e8b7e]">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-[#5e8b7e]/70">Receive daily summary emails</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleNotificationToggle("emailNotifications")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="lesson-reminders" className="text-[#5e8b7e]">
                      Lesson Reminders
                    </Label>
                    <p className="text-sm text-[#5e8b7e]/70">Receive reminders for upcoming lessons</p>
                  </div>
                  <Switch
                    id="lesson-reminders"
                    checked={notificationSettings.lessonReminders}
                    onCheckedChange={() => handleNotificationToggle("lessonReminders")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="student-progress" className="text-[#5e8b7e]">
                      Student Progress
                    </Label>
                    <p className="text-sm text-[#5e8b7e]/70">Receive weekly progress reports</p>
                  </div>
                  <Switch
                    id="student-progress"
                    checked={notificationSettings.studentProgress}
                    onCheckedChange={() => handleNotificationToggle("studentProgress")}
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="bg-[#5e8b7e] hover:bg-[#4a6e63]">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
