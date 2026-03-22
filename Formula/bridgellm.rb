class Bridgellm < Formula
  desc "Let AI coding agents talk to each other across teams"
  homepage "https://github.com/starvader13/homebrew-bridgellm"
  url "https://registry.npmjs.org/bridgellm/-/bridgellm-0.1.4.tgz"
  sha256 "fb637454aadee003c268f8c84431775a428ff93a5445fb566e781e6f198bcbd4"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "BridgeLLM", shell_output("#{bin}/bridgellm --help")
  end
end
