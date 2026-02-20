"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { ValidationMessage } from "../../shared";
interface SlackConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function SlackConfig({ data, onSave }: SlackConfigProps) {
    const [responseName, setResponseName] = useState(data.responseName || "slackResponse");
    const [credentialId, setCredentialId] = useState(data.credentialId || "");
    const [channel, setChannel] = useState(data.channel || "");
    const [message, setMessage] = useState(data.message || "");
    const [username, setUsername] = useState(data.username || "");
    const [iconEmoji, setIconEmoji] = useState(data.iconEmoji || "");
    const credentialsQuery = trpc.credentials.getAll.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });
    const slackCredentials = (credentialsQuery.data ?? []).filter((credential) => credential.platform === 'slack');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            responseName,
            credentialId,
            channel,
            message,
            username,
            iconEmoji,
        });
    };
    const isSaveDisabled = !responseName.trim() || !credentialId || !message.trim();
    const missingFields: string[] = [];
    if (!responseName.trim())
        missingFields.push('Response Name');
    if (!credentialId)
        missingFields.push('Credential');
    if (!message.trim())
        missingFields.push('Message');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Response Name</Label>
        <Input value={responseName} onChange={(e) => setResponseName(e.target.value)} placeholder="slackResponse" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        <p className="text-xs text-white/40">
          Use this name to reference the response in other nodes: {`{{${responseName}.data}}`}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Credential</Label>
        <select value={credentialId} onChange={(e) => setCredentialId(e.target.value)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Select a credential</option>
          {slackCredentials.map((credential) => (<option key={credential.id} value={credential.id}>
              {credential.title}
            </option>))}
        </select>
        <p className="text-xs text-white/40">
          No credentials?{" "}
          <a href="/home/credentials" className="text-[#F04D26] hover:text-[#F04D26]/90 underline">
            Add one in Credentials page
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Channel</Label>
        <Input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="#channel-name" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        <p className="text-xs text-white/40">
          Modern Slack apps may ignore this field.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Message</Label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hello from Fynt!" rows={4} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none"/>
        <p className="text-xs text-white/40">
          The message to send. Use {`{{variables}}`} for simple values or {`{{json variables}}`} to stringify objects.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Username</Label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Workflow Bot" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        <p className="text-xs text-white/40">
          The username to display for this message.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Icon Emoji</Label>
        <Input value={iconEmoji} onChange={(e) => setIconEmoji(e.target.value)} placeholder=":robot:" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        <p className="text-xs text-white/40">
          The emoji to use as the message icon.
        </p>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={isSaveDisabled} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50 disabled:text-white/70">
        Save
      </Button>
    </form>);
}
