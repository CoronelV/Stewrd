// Package tunnel opens SSH tunnels used to reach databases that are not
// directly exposed (e.g. MySQL on PythonAnywhere).
package tunnel

import (
	"context"
	stdErrors "errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/knownhosts"

	appErrors "github.com/CoronelV/Stewrd/internal/errors"
)

const (
	defaultSshPort     = 22
	defaultDialTimeout = 10 * time.Second
)

// Config describes how to reach the SSH server. At least one of Password or
// PrivateKeyPath is required.
type Config struct {
	Host           string
	Port           int // defaults to 22
	User           string
	Password       string
	PrivateKeyPath string // must not be passphrase protected

	// KnownHostsPath defaults to ~/.ssh/known_hosts.
	KnownHostsPath string
	// InsecureIgnoreHostKey disables host key verification (MITM risk).
	InsecureIgnoreHostKey bool

	DialTimeout time.Duration // defaults to 10s
}

// Tunnel is an established SSH connection able to dial remote addresses
// relative to the SSH server.
type Tunnel struct {
	client *ssh.Client
}

// Open connects and authenticates against the SSH server.
func Open(ctx context.Context, cfg Config) (*Tunnel, error) {
	if err := cfg.normalize(); err != nil {
		return nil, err
	}
	authMethods, err := cfg.authMethods()
	if err != nil {
		return nil, err
	}
	hostKeyCallback, err := cfg.hostKeyCallback()
	if err != nil {
		return nil, err
	}

	addr := net.JoinHostPort(cfg.Host, strconv.Itoa(cfg.Port))
	dialer := net.Dialer{Timeout: cfg.DialTimeout}
	conn, err := dialer.DialContext(ctx, "tcp", addr)
	if err != nil {
		return nil, appErrors.New(appErrors.CodeConnection, "cannot reach SSH server "+addr, err)
	}

	// The handshake is not context aware: bound it by a deadline and by ctx.
	deadline := time.Now().Add(cfg.DialTimeout)
	if ctxDeadline, ok := ctx.Deadline(); ok && ctxDeadline.Before(deadline) {
		deadline = ctxDeadline
	}
	_ = conn.SetDeadline(deadline)
	stopCloseOnCancel := context.AfterFunc(ctx, func() { _ = conn.Close() })

	clientConfig := &ssh.ClientConfig{
		User:            cfg.User,
		Auth:            authMethods,
		HostKeyCallback: hostKeyCallback,
	}
	sshConn, channels, requests, err := ssh.NewClientConn(conn, addr, clientConfig)
	stopCloseOnCancel()
	if err != nil {
		_ = conn.Close()
		return nil, handshakeError(addr, err)
	}
	_ = conn.SetDeadline(time.Time{})

	return &Tunnel{client: ssh.NewClient(sshConn, channels, requests)}, nil
}

// DialContext opens a connection to addr ("host:port") from the SSH server.
// Its signature matches mysql.Config.DialFunc.
func (t *Tunnel) DialContext(ctx context.Context, network, addr string) (net.Conn, error) {
	type dialResult struct {
		conn net.Conn
		err  error
	}
	results := make(chan dialResult, 1)
	go func() {
		conn, err := t.client.Dial(network, addr)
		results <- dialResult{conn: conn, err: err}
	}()

	select {
	case <-ctx.Done():
		go func() { // do not leak a connection that completes after cancel
			if result := <-results; result.conn != nil {
				_ = result.conn.Close()
			}
		}()
		return nil, ctx.Err()
	case result := <-results:
		return result.conn, result.err
	}
}

func (t *Tunnel) Close() error {
	return t.client.Close()
}

func (c *Config) normalize() error {
	if c.Host == "" {
		return appErrors.New(appErrors.CodeValidation, "ssh host is required", nil)
	}
	if c.User == "" {
		return appErrors.New(appErrors.CodeValidation, "ssh user is required", nil)
	}
	if c.Port == 0 {
		c.Port = defaultSshPort
	}
	if c.Port < 1 || c.Port > 65535 {
		return appErrors.New(appErrors.CodeValidation, "ssh port must be between 1 and 65535", nil)
	}
	if c.Password == "" && c.PrivateKeyPath == "" {
		return appErrors.New(appErrors.CodeValidation, "ssh password or private key file is required", nil)
	}
	if c.DialTimeout <= 0 {
		c.DialTimeout = defaultDialTimeout
	}
	return nil
}

func (c Config) authMethods() ([]ssh.AuthMethod, error) {
	var methods []ssh.AuthMethod

	if c.PrivateKeyPath != "" {
		pem, err := os.ReadFile(c.PrivateKeyPath)
		if err != nil {
			return nil, appErrors.New(appErrors.CodeValidation, "cannot read ssh private key file", err)
		}
		signer, err := ssh.ParsePrivateKey(pem)
		if err != nil {
			var missingPassphrase *ssh.PassphraseMissingError
			if stdErrors.As(err, &missingPassphrase) {
				return nil, appErrors.New(appErrors.CodeValidation, "passphrase protected ssh keys are not supported", err)
			}
			return nil, appErrors.New(appErrors.CodeValidation, "invalid ssh private key file", err)
		}
		methods = append(methods, ssh.PublicKeys(signer))
	}

	if c.Password != "" {
		password := c.Password
		methods = append(methods, ssh.Password(password))
		// Some servers only offer password auth through keyboard-interactive.
		methods = append(methods, ssh.KeyboardInteractive(
			func(_, _ string, questions []string, _ []bool) ([]string, error) {
				answers := make([]string, len(questions))
				for i := range answers {
					answers[i] = password
				}
				return answers, nil
			}))
	}
	return methods, nil
}

func (c Config) hostKeyCallback() (ssh.HostKeyCallback, error) {
	if c.InsecureIgnoreHostKey {
		return ssh.InsecureIgnoreHostKey(), nil
	}
	path := c.KnownHostsPath
	if path == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return nil, appErrors.New(appErrors.CodeValidation, "cannot locate known_hosts file", err)
		}
		path = filepath.Join(home, ".ssh", "known_hosts")
	}
	callback, err := knownhosts.New(path)
	if err != nil {
		return nil, appErrors.New(appErrors.CodeValidation,
			fmt.Sprintf("cannot load known_hosts file %q", path), err)
	}
	return callback, nil
}

func handshakeError(addr string, err error) error {
	var keyErr *knownhosts.KeyError
	if stdErrors.As(err, &keyErr) {
		if len(keyErr.Want) == 0 {
			return appErrors.New(appErrors.CodeConnection,
				"ssh host "+addr+" is not in known_hosts; connect once with an ssh client to trust it", err)
		}
		return appErrors.New(appErrors.CodeConnection,
			"ssh host key for "+addr+" does not match known_hosts (possible man-in-the-middle)", err)
	}
	return appErrors.New(appErrors.CodeConnection, "ssh handshake with "+addr+" failed", err)
}
