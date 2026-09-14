import urllib.request
import urllib.parse
import json
import http.cookiejar
import sys
import uuid

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000"

def test_step5_end_to_end():
    print("==================================================")
    print("STEP 5: END-TO-END CHATBOT & ISOLATION VERIFICATION")
    print("==================================================")

    # 1. Register & Login User A
    uid_a = uuid.uuid4().hex[:8]
    user_a_email = f"seeker_a_{uid_a}@gitamitra.com"
    user_a_password = "SecurePassword123!"
    user_a_name = "Arjun Seeker"

    cj_a = http.cookiejar.CookieJar()
    opener_a = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj_a))

    print(f"\n[1] Registering User A: {user_a_email}")
    reg_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=json.dumps({"name": user_a_name, "email": user_a_email, "password": user_a_password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with opener_a.open(reg_req) as res:
        assert res.status == 201

    print(f"[2] Logging in User A")
    login_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=json.dumps({"email": user_a_email, "password": user_a_password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with opener_a.open(login_req) as res:
        login_data = json.loads(res.read().decode())
        token_a = login_data["access_token"]
        assert bool(token_a)

    headers_a = {"Content-Type": "application/json", "Authorization": f"Bearer {token_a}"}

    # 2. Create Conversation for User A
    print(f"[3] Creating new conversation for User A")
    conv_req = urllib.request.Request(
        f"{BASE_URL}/api/conversations",
        data=json.dumps({"title": "Interview Anxiety"}).encode("utf-8"),
        headers=headers_a
    )
    with opener_a.open(conv_req) as res:
        conv_data = json.loads(res.read().decode())
        conv_id = conv_data["id"]
        print(f"  Created Conversation ID: {conv_id}")

    # 3. Send Required Spiritual Query via Non-Streaming API
    query_text = "I am terrified that I will fail my upcoming interview. I keep thinking about the result instead of preparing."
    print(f"\n[4] Sending Message to /api/chat:")
    print(f"  User Query: \"{query_text}\"")

    chat_req = urllib.request.Request(
        f"{BASE_URL}/api/chat",
        data=json.dumps({"conversation_id": conv_id, "message": query_text}).encode("utf-8"),
        headers=headers_a
    )
    with opener_a.open(chat_req) as res:
        chat_data = json.loads(res.read().decode())
        print(f"\n[5] Received Chat Response:")
        print(f"  User Message ID: {chat_data['user_message_id']}")
        print(f"  Assistant Message ID: {chat_data['assistant_message_id']}")
        print(f"  Emotions Detected: {chat_data.get('emotions', [])}")
        print(f"  Has Relevant Context: {chat_data['has_relevant_context']}")
        print(f"  Verified References Attached: {len(chat_data['references'])}")
        for ref in chat_data["references"]:
            print(f"    - {ref['reference']} (Ch.{ref['chapter']} V.{ref['verse']}) | Score: {ref['relevance_score']}")

        print("\n--- Response Preview ---")
        print(chat_data["response"][:400] + "...")
        print("------------------------")

        # Grounding Assertions
        assert chat_data["has_relevant_context"] is True
        assert len(chat_data["references"]) > 0
        top_ref = chat_data["references"][0]
        assert top_ref["chapter"] == 2 and top_ref["verse"] == 47, f"Expected 2.47, got {top_ref['chapter']}.{top_ref['verse']}"
        assert "2.47" in chat_data["response"] or "कर्मण्येवाधिकारस्ते" in chat_data["response"] or "right is only to work" in chat_data["response"].lower()

    # 4. Send Message via Streaming Endpoint (SSE)
    print(f"\n[6] Testing SSE Streaming (/api/chat/stream)...")
    stream_query = "What does the Gita teach about controlling anger and a restless mind?"
    stream_req = urllib.request.Request(
        f"{BASE_URL}/api/chat/stream",
        data=json.dumps({"conversation_id": conv_id, "message": stream_query}).encode("utf-8"),
        headers=headers_a
    )
    with opener_a.open(stream_req) as res:
        assert "text/event-stream" in res.headers["Content-Type"]
        events_received = []
        tokens_received = []
        for line in res:
            line_str = line.decode("utf-8").strip()
            if line_str.startswith("event:"):
                events_received.append(line_str.split(":")[1].strip())
            elif line_str.startswith("data:"):
                try:
                    payload = json.loads(line_str[5:].strip())
                    if "token" in payload:
                        tokens_received.append(payload["token"])
                except Exception:
                    pass

        print(f"  SSE Events Received: {list(set(events_received))}")
        print(f"  Streamed Tokens Count: {len(tokens_received)}")
        print(f"  Streamed Text Sample: {''.join(tokens_received[:15])}...")
        assert "init" in events_received
        assert "retrieval" in events_received
        assert "token" in events_received
        assert "complete" in events_received
        assert len(tokens_received) > 10

    # 5. Verify Conversation History & Message Persistence
    print(f"\n[7] Verifying Conversation History Persistence:")
    detail_req = urllib.request.Request(f"{BASE_URL}/api/conversations/{conv_id}", headers=headers_a)
    with opener_a.open(detail_req) as res:
        detail_data = json.loads(res.read().decode())
        messages = detail_data["messages"]
        print(f"  Total Persisted Messages in Conversation: {len(messages)}")
        assert len(messages) == 4 # 2 user messages, 2 assistant messages
        assert messages[0]["role"] == "user"
        assert messages[1]["role"] == "assistant"
        assert messages[2]["role"] == "user"
        assert messages[3]["role"] == "assistant"

    # 6. Verify User B Isolation (Security Requirement)
    print(f"\n[8] Verifying Multi-User Isolation with User B:")
    uid_b = uuid.uuid4().hex[:8]
    user_b_email = f"seeker_b_{uid_b}@gitamitra.com"
    user_b_password = "SecurePassword123!"

    cj_b = http.cookiejar.CookieJar()
    opener_b = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj_b))

    # Register & Login User B
    reg_req_b = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=json.dumps({"name": "User B", "email": user_b_email, "password": user_b_password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with opener_b.open(reg_req_b):
        pass

    login_req_b = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=json.dumps({"email": user_b_email, "password": user_b_password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with opener_b.open(login_req_b) as res:
        token_b = json.loads(res.read().decode())["access_token"]

    headers_b = {"Content-Type": "application/json", "Authorization": f"Bearer {token_b}"}

    # User B attempts to access User A's conversation
    unauthorized_req = urllib.request.Request(
        f"{BASE_URL}/api/conversations/{conv_id}",
        headers=headers_b
    )
    try:
        with opener_b.open(unauthorized_req) as res:
            assert False, "Security breach! User B was able to access User A's conversation!"
    except urllib.error.HTTPError as e:
        print(f"  User B access attempt blocked with HTTP Status {e.code} (Not Found / Forbidden)")
        assert e.code == 404

    # User B attempts to send message to User A's conversation
    unauthorized_msg_req = urllib.request.Request(
        f"{BASE_URL}/api/chat",
        data=json.dumps({"conversation_id": conv_id, "message": "Can I see this?"}).encode("utf-8"),
        headers=headers_b
    )
    try:
        with opener_b.open(unauthorized_msg_req) as res:
            assert False, "Security breach! User B was able to inject message into User A's conversation!"
    except urllib.error.HTTPError as e:
        print(f"  User B message injection blocked with HTTP Status {e.code}")
        assert e.code == 404

    print("\n==================================================")
    print("STEP 5 VERIFICATION COMPLETED: 100% PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_step5_end_to_end()
