"""Slack 通知 (Webhook URL があれば送信)"""
import os
import requests


def notify(text: str) -> None:
    webhook = os.environ.get("SLACK_WEBHOOK_URL", "").strip()
    if not webhook:
        # Webhook 未設定でもエラーにせず、 標準出力に出す
        print(f"  [notify] {text}")
        return
    try:
        requests.post(webhook, json={"text": text}, timeout=10)
    except Exception as e:
        print(f"  [notify] Slack 送信失敗: {e}")
