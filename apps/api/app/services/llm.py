"""Service for LLM integration (OpenAI)."""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List
from openai import OpenAI


class LLMService:
    """Service for LLM operations (chat completion)."""

    def __init__(self, api_key: str):
        """Initialize the LLMService.
        
        Args:
            api_key: OpenAI API key
        """
        self.client = OpenAI(api_key=api_key)
        # Use a thread pool executor to run synchronous calls without blocking the event loop
        self._executor = ThreadPoolExecutor(max_workers=1)

    def _generate_response_sync(
        self,
        messages: List[dict],
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> str:
        """Synchronous helper method for generating responses.
        
        This runs in a thread pool to avoid blocking the event loop.
        """
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream
            )
            
            if stream:
                # Handle streaming response
                collected_messages = []
                for chunk in response:
                    if chunk.choices[0].delta.content:
                        collected_messages.append(chunk.choices[0].delta.content)
                return "".join(collected_messages)
            else:
                return response.choices[0].message.content
            
        except Exception as e:
            raise ValueError(f"Failed to generate LLM response: {str(e)}") from e

    async def generate_response(
        self,
        messages: List[dict],
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> str:
        """Generate a chat response.
        
        This method runs the synchronous OpenAI call in a thread pool executor
        to avoid blocking the event loop.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: Model to use (default: gpt-3.5-turbo)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            
        Returns:
            Generated response text
            
        Raises:
            ValueError: If API call fails
        """
        # Run the synchronous call in a thread pool executor
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self._executor,
            self._generate_response_sync,
            messages,
            model,
            temperature,
            max_tokens,
            stream
        )

    def generate_response_streaming(
        self,
        messages: List[dict],
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ):
        """Generate a streaming chat response.
        
        Args:
            messages: List of message dictionaries
            model: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Yields:
            Response chunks as they're generated
        """
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            raise ValueError(f"Failed to generate streaming LLM response: {str(e)}") from e
