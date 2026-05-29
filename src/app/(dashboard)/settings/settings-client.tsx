"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { profileSchema, changePasswordSchema, categorySchema, tagSchema } from "@/lib/validations";
import {
  updateProfileAction,
  changePasswordAction,
} from "@/server/actions/user.actions";
import {
  createCategoryAction,
  deleteCategoryAction,
  createTagAction,
  deleteTagAction,
} from "@/server/actions/taxonomy.actions";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Profile = { name: string; email?: string; phone?: string };
type Category = { _id: string; name: string; type: "INCOME" | "EXPENSE" };
type Tag = { _id: string; name: string };

export function SettingsClient({
  profile,
  categories,
  tags,
}: {
  profile: Profile;
  categories: Category[];
  tags: Tag[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, security, and taxonomy." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="taxonomy">Categories & Tags</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileForm profile={profile} /></TabsContent>
        <TabsContent value="security"><PasswordForm /></TabsContent>
        <TabsContent value="taxonomy"><Taxonomy categories={categories} tags={tags} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { toast } = useToast();
  type V = z.infer<typeof profileSchema>;
  const form = useForm<V>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, email: profile.email ?? "", phone: profile.phone ?? "" },
  });

  async function onSubmit(values: V) {
    const res = await updateProfileAction(values);
    if (res.success) toast({ title: "Profile updated", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your name and contact details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input {...form.register("phone")} />
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>Save changes</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const { toast } = useToast();
  type V = z.infer<typeof changePasswordSchema>;
  const form = useForm<V>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: V) {
    const res = await changePasswordAction(values);
    if (res.success) {
      toast({ title: "Password changed", variant: "success" });
      form.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else toast({ title: "Error", description: res.error, variant: "error" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Use a strong password you don&apos;t reuse elsewhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label>Current password</Label>
            <Input type="password" {...form.register("currentPassword")} />
            {form.formState.errors.currentPassword && <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" {...form.register("newPassword")} />
            {form.formState.errors.newPassword && <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Confirm new password</Label>
            <Input type="password" {...form.register("confirmPassword")} />
            {form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>Update password</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Taxonomy({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  const { toast } = useToast();
  const [catName, setCatName] = React.useState("");
  const [catType, setCatType] = React.useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [tagName, setTagName] = React.useState("");

  async function addCategory() {
    const parsed = categorySchema.safeParse({ name: catName, type: catType });
    if (!parsed.success) return toast({ title: "Enter a category name", variant: "error" });
    const res = await createCategoryAction(parsed.data);
    if (res.success) { setCatName(""); toast({ title: "Category added", variant: "success" }); }
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  async function addTag() {
    const parsed = tagSchema.safeParse({ name: tagName });
    if (!parsed.success) return toast({ title: "Enter a tag name", variant: "error" });
    const res = await createTagAction(parsed.data);
    if (res.success) { setTagName(""); toast({ title: "Tag added", variant: "success" }); }
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Category name" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <Select value={catType} onValueChange={(v) => setCatType(v as "INCOME" | "EXPENSE")}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" onClick={addCategory}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge key={c._id} variant={c.type === "INCOME" ? "success" : "secondary"} className="gap-1">
                {c.name}
                <button onClick={async () => { await deleteCategoryAction(c._id); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Tag name" value={tagName} onChange={(e) => setTagName(e.target.value)} />
            <Button size="icon" onClick={addTag}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Badge key={t._id} variant="outline" className="gap-1">
                {t.name}
                <button onClick={async () => { await deleteTagAction(t._id); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
