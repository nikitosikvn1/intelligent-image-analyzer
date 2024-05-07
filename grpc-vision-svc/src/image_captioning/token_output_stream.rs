use std::fmt;
use candle_core::Result;
use tokenizers::Tokenizer;

/// [`TokenOutputStream`] is a wrapper around a tokenizer that allows for streaming tokens to the user
/// rather than waiting for the full decoding to complete.
pub struct TokenOutputStream {
    tokenizer: Tokenizer,
    tokens: Vec<u32>,
    prev_index: usize,
    current_index: usize,
}

impl fmt::Debug for TokenOutputStream {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("TokenOutputStream")
            .field("tokens", &self.tokens)
            .field("prev_index", &self.prev_index)
            .field("current_index", &self.current_index)
            .finish()
    }
}

impl TokenOutputStream {
    /// Creates a new [`TokenOutputStream`] instance.
    ///
    /// # Arguments
    ///
    /// * `tokenizer` - A [`Tokenizer`] instance to be used for tokenizing.
    ///
    /// # Returns
    ///
    /// A new [`TokenOutputStream`] instance.
    pub fn new(tokenizer: Tokenizer) -> Self {
        Self {
            tokenizer,
            tokens: Vec::new(),
            prev_index: 0,
            current_index: 0,
        }
    }

    /// Consumes the [`TokenOutputStream`], returning the inner [`Tokenizer`].
    ///
    /// This method is used when the [`TokenOutputStream`] is no longer needed,
    /// and you want to access the underlying [`Tokenizer`].
    ///
    /// # Returns
    ///
    /// The inner [`Tokenizer`] instance.
    pub fn into_inner(self) -> Tokenizer {
        self.tokenizer
    }

    /// Provides a reference to the inner [`Tokenizer`].
    ///
    /// This method is used when you want to access the underlying [`Tokenizer`]
    /// but still keep the [`TokenOutputStream`] for further use.
    ///
    /// # Returns
    ///
    /// A reference to the inner [`Tokenizer`] instance.
    pub fn tokenizer(&self) -> &Tokenizer {
        &self.tokenizer
    }

    /// Retrieves the token associated with a given string.
    ///
    /// # Arguments
    ///
    /// * `token_s` - A string representation of the token.
    ///
    /// # Returns
    ///
    /// An `Option` which contains the token if it exists, or `None` if it does not.
    pub fn get_token(&self, token_s: &str) -> Option<u32> {
        self.tokenizer.get_vocab(true).get(token_s).copied()
    }

    /// Clears the [`TokenOutputStream`].
    ///
    /// This method is used to reset the state of the [`TokenOutputStream`]. It clears the tokens
    /// and resets the `prev_index` and `current_index` to 0.
    pub fn clear(&mut self) {
        self.tokens.clear();
        self.prev_index = 0;
        self.current_index = 0;
    }

    /// Processes the next token and returns the decoded string if the token leads to a new word.
    ///
    /// # Arguments
    ///
    /// * `token` - The next token to process.
    ///
    /// # Returns
    ///
    /// A `Result` which contains an `Option` with the decoded string if the token leads to a new word,
    /// or `None` if it does not. Returns an error if the decoding fails.
    ///
    /// # Example
    ///
    /// ```
    /// // Assuming that the `tokenizer.json` file contains the following vocab:
    /// // { "hello": 1, "world": 2, "everybody": 3 }
    /// let tokenizer = Tokenizer::from_file("path/to/tokenizer.json").unwrap();
    /// let mut stream = TokenOutputStream::new(tokenizer);
    /// 
    /// let tokens: [u32; 4] = [1, 2, 1, 3];
    ///
    /// let sent: String = tokens
    ///     .iter()
    ///     .filter_map(|token| stream.next_token(*token).ok())
    ///     .flatten()
    ///     .collect();
    ///
    /// assert_eq!(sent, "hello world hello everybody");
    /// ```
    pub fn next_token(&mut self, token: u32) -> Result<Option<String>> {
        let prev_text: String = if self.tokens.is_empty() {
            String::new()
        } else {
            let tokens: &[u32] = &self.tokens[self.prev_index..self.current_index];
            self.decode(tokens)?
        };
        self.tokens.push(token);

        let text: String = self.decode(&self.tokens[self.prev_index..])?;

        if text.len() > prev_text.len() && text.chars().last().unwrap().is_alphanumeric() {
            let text: (&str, &str) = text.split_at(prev_text.len());
            self.prev_index = self.current_index;
            self.current_index = self.tokens.len();
            Ok(Some(text.1.to_string()))
        } else {
            Ok(None)
        }
    }

    /// Decodes the remaining tokens and returns the decoded string if there are any new words.
    ///
    /// # Returns
    ///
    /// A `Result` which contains an `Option` with the decoded string if there are any new words,
    /// or `None` if there are not. Returns an error if the decoding fails.
    pub fn decode_rest(&self) -> Result<Option<String>> {
        let prev_text: String = if self.tokens.is_empty() {
            String::new()
        } else {
            let tokens: &[u32] = &self.tokens[self.prev_index..self.current_index];
            self.decode(tokens)?
        };

        let text: String = self.decode(&self.tokens[self.prev_index..])?;

        if text.len() > prev_text.len() {
            let text: (&str, &str) = text.split_at(prev_text.len());
            Ok(Some(text.1.to_string()))
        } else {
            Ok(None)
        }
    }

    /// Decodes all tokens in the [`TokenOutputStream`] and returns the decoded string.
    ///
    /// # Returns
    ///
    /// A `Result` which contains the decoded string if the decoding is successful,
    /// or an error if the decoding fails.
    pub fn decode_all(&self) -> Result<String> {
        self.decode(&self.tokens)
    }

    /// Decodes a slice of tokens into a string.
    ///
    /// # Arguments
    ///
    /// * `tokens` - A slice of tokens to be decoded.
    ///
    /// # Returns
    ///
    /// A `Result` which contains the decoded string if the decoding is successful,
    /// or an error if the decoding fails.
    fn decode(&self, tokens: &[u32]) -> Result<String> {
        match self.tokenizer.decode(tokens, true) {
            Ok(str) => Ok(str),
            Err(err) => candle_core::bail!("cannot decode: {err}"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    const TOKENIZER_JSON: &str = r#"{
        "model": {
            "vocab": {
                "male": 0,
                "bring": 1,
                "goals": 2,
                "mexico": 3,
                "problem": 4
            },
            "merges": []
        }
    }"#;

    #[test]
    fn test_token_output_stream_debug_impl() {
        // GIVEN
        let tokenizer: Tokenizer = Tokenizer::from_str(TOKENIZER_JSON).unwrap();
        let tos: TokenOutputStream = TokenOutputStream::new(tokenizer);
        // WHEN + THEN
        assert_eq!(
            format!("{:?}", tos),
            "TokenOutputStream { tokens: [], prev_index: 0, current_index: 0 }",
        );
    }

    #[test]
    fn test_token_output_stream_next_token() {
        // GIVEN
        let tokenizer: Tokenizer = Tokenizer::from_str(TOKENIZER_JSON).unwrap();
        let mut tos: TokenOutputStream = TokenOutputStream::new(tokenizer);
        // WHEN + THEN
        assert_eq!(tos.next_token(2).unwrap(), Some(String::from("goals")));
        assert_eq!(tos.next_token(4).unwrap(), Some(String::from(" problem")));
        assert!(tos.next_token(5).unwrap().is_none()); // Non-existent token
    }

    #[test]
    fn test_token_output_stream_decode_rest() {
        // GIVEN
        let tokenizer: Tokenizer = Tokenizer::from_str(TOKENIZER_JSON).unwrap();
        let mut tos: TokenOutputStream = TokenOutputStream::new(tokenizer);

        tos.prev_index = 1;
        tos.current_index = 2;
        tos.tokens = vec![1, 2, 3, 4, 0];
        // WHEN + THEN
        assert_eq!(tos.decode_rest().unwrap(), Some(String::from(" mexico problem male")));
    }

    #[test]
    fn test_token_output_stream_decode_all() {
        // GIVEN
        let tokenizer: Tokenizer = Tokenizer::from_str(TOKENIZER_JSON).unwrap();
        let mut tos: TokenOutputStream = TokenOutputStream::new(tokenizer);

        tos.next_token(0).unwrap(); // "male"
        tos.next_token(1).unwrap(); // "bring"
        tos.next_token(2).unwrap(); // "goals"
        tos.next_token(10).unwrap(); // Non-existent token (None)
        // WHEN + THEN
        assert_eq!(tos.decode_all().unwrap(), "male bring goals");
    }

    #[test]
    fn test_token_output_stream_get_token() {
        // GIVEN
        let tokenizer: Tokenizer = Tokenizer::from_str(TOKENIZER_JSON).unwrap();
        let tos: TokenOutputStream = TokenOutputStream::new(tokenizer);
        // WHEN + THEN
        assert_eq!(tos.get_token("mexico"), Some(3));
        assert!(tos.get_token("mexican").is_none());
    }
}
