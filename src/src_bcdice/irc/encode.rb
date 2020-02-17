# -*- coding: utf-8 -*-

if RUBY_VERSION < '1.9.0'

  require 'kconv'

  # String クラスに擬似的な 1.9.0 互換の encoding および encode メソッドを追加します。
  # ただし、完全な互換性は持ちません。
  class String
    @encoding = nil

    # エンコーディングを取得します。
    def encoding
      if !@encoding.nil?
        return @encoding
      else
        case Kconv.guess(self)
        when Kconv::JIS
          return "ISO-2022-JP"
        when Kconv::SJIS
          return "Shift_JIS"
        when Kconv::EUC
          return "EUC-JP"
        when Kconv::ASCII
          return "ASCII"
        when Kconv::UTF8
          return "UTF-8"
        when Kconv::UTF16
          return "UTF-16BE"
        when Kconv::UNKNOWN
          return nil
        when Kconv::BINARY
          return nil
        else
          return nil
        end
      end
    end

    # エンコードを変更します（options 未対応）。
    def encode(to_encoding, from_encoding = nil, _options = nil)
      if from_encoding.nil?
        if @encoding.nil?
          f_encoding = Kconv::AUTO
        else
          f_encoding = @encoding
        end
      else
        f_encoding = get_kconv_encoding(from_encoding)
      end

      result = Kconv.kconv(self, get_kconv_encoding(to_encoding), f_encoding)
      result.set_encoding(to_encoding)
      return result
    end

    def get_kconv_encoding(encoding)
      unless encoding.nil?
        case encoding.upcase
        when "ISO-2022-JP"
          return Kconv::JIS
        when "SHIFT_JIS"
          return Kconv::SJIS
        when "EUC-JP"
          return Kconv::EUC
        when "ASCII"
          return Kconv::ASCII
        when "UTF-8"
          return Kconv::UTF8
        when "UTF-16BE"
          return Kconv::UTF16
        else
          return Kconv::UNKNOWN
        end
      end
    end
    private :get_kconv_encoding

    def set_encoding(encoding)
      @encoding = encoding
    end

    def force_encoding_maybe(enc)
      if "".respond_to? :force_encoding
        force_encoding enc
      else
        self
      end
    end
  end

end
