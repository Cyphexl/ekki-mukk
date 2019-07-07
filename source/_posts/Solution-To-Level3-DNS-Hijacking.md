---
title: Solution to Level3 DNS Hijacking on VPN Servers
date: 2018-01-07 19:47:54
tags: Tech
---

## BACKGROUND

前些日子，在地址栏中输入一个已失效的 URL 时，页面并不像被期待的那样返回 404 错误 / 502 错误或「找不到对应的 IP 地址」，而是返回了 Level(3) 搜索引擎的推荐结果。

<figure>
    {% asset_img level3.png %}
    <figcaption>仅为示例，原页面包含了数页的搜索结果及广告。</figcaption>
</figure>

在境内，发生 Level(3) 跳转的情况并不多见，但如果你的网络环境使用了*科学上网代理*，那么这一现象便仍然非常有可能发生。

## CAUSE

显而易见，发出的网络请求被 Level(3) 劫持了。虽然吃相并没有那么不堪，但是和国内运营商的流量劫持终究是同种性质。虽然可以在页面右端的 Settings – Search Guide Settings 将搜索建议选项关闭，但我们希望从根源上解决这一问题。

**URL 跳转的本质原因是使用了来自行为不端的公司提供的 DNS 服务器。**在这里，作网络代理使用的 VPS 使用了来自 Level3 Communications 提供的 DNS 服务器：

```ini
# Level 3 Communication DNS Servers
4.2.2.1
4.2.2.2
4.2.2.3
4.2.2.4
4.2.2.5
4.2.2.6
```

我们只需要在主机的配置中，将其替换为更加可靠的服务器即可：

```ini
# Google Public DNS
8.8.8.8
8.8.4.4

# OpenDNS
208.67.222.222
208.67.220.220
```

## TACKLE

在 CentOS 6 中，需要对 /etc/resolv.conf 中的文件进行修改：将涉及到 Level 3 DNS Server 的地址删除并保存，如有需要，可以使用其它 DNS 服务器替换。

```ini
search localdomain
nameserver 8.8.8.8
nameserver 74.82.42.42
nameserver 4.2.2.1 # 删除本行，或者替代以 208.67.222.222
nameserver 8.8.4.4
```

但故事并没有结束：**当主机重启后，resolv.conf 被强制重写回 Level3 的 DNS 服务器。**对此，有两种解决办法：

### Reconfigure dhclient.conf

在 `interface` block 中加入这一行内容：

```ini
prepend domain-name-servers 8.8.4.4
```

通常能够解决。但有时 dhclient.conf 文件不存在，或是由 VPS Hosting 机构的脚本来控制的，无法被终端用户所修改。此时，我们暂且只能采用备用的、不那么优雅的解决方案：

### Write protection to /etc/resolv.conf

在终端使用 `chattr` 命令进行写保护：

```ini
$ chattr +i /etc/resolv.conf
```

这一行命令使得即便 root 用户也无法对 resolv.conf 进行重写。如果你的主机只用来作代理使用，那么进行这一强制更改通常是可接受的，并没有太大的问题。